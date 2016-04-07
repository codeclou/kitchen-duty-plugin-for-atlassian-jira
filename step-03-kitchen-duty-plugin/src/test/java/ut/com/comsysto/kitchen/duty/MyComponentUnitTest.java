package ut.com.comsysto.kitchen.duty;

import org.junit.Test;
import com.comsysto.kitchen.duty.api.MyPluginComponent;
import com.comsysto.kitchen.duty.impl.MyPluginComponentImpl;

import static org.junit.Assert.assertEquals;

public class MyComponentUnitTest
{
    @Test
    public void testMyName()
    {
        MyPluginComponent component = new MyPluginComponentImpl(null);
        assertEquals("names do not match!", "myComponent",component.getName());
    }
}